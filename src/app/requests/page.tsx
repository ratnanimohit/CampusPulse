import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RequestsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Create a New Request</CardTitle>
                <CardDescription>Let the community know what item you need.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <FormLabel>Item Name</FormLabel>
                    <Input placeholder="e.g., Electric Iron, Graphic Calculator" />
                </div>
                 <div className="space-y-2">
                    <FormLabel>Reason for Request</FormLabel>
                    <Textarea placeholder="Describe why you need this item..." />
                </div>
                 <div className="space-y-2">
                    <FormLabel>Urgency Level</FormLabel>
                     <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="normal">Normal Need (Standard distance)</SelectItem>
                            <SelectItem value="medium">Medium Need (Extended distance)</SelectItem>
                            <SelectItem value="emergency">Emergency Need (Maximum distance)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <FormLabel>Required By</FormLabel>
                    <Input type="datetime-local" />
                </div>
            </CardContent>
            <CardFooter>
                <Button>Submit Request</Button>
            </CardFooter>
        </Card>
    );
}
